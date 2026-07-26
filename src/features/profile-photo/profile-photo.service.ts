import type { Patient, User } from "@/types";
import { PatientRepository } from "@/repositories/patient.repository";
import { UserRepository } from "@/repositories/user.repository";
import { ProfilePhotoError } from "./profile-photo.errors";
import type {
  DownloadedProfilePhoto,
  ProfilePhotoMutationResult,
  ProfilePhotoOwnerType,
  ProfilePhotoStorage,
  ProfilePhotoUpload,
} from "./profile-photo.types";
import { VercelBlobProfilePhotoStorage } from "./vercel-blob-profile-photo-storage";

interface ProfilePhotoOwner {
  profilePhotoPath?: string;
}

interface ProfilePhotoOwnerRepository<T extends ProfilePhotoOwner> {
  findById(id: string): Promise<T | null>;

  updateProfilePhoto(id: string, pathname: string | null): Promise<void>;
}

export interface ProfilePhotoServiceDependencies {
  storage?: ProfilePhotoStorage;
  users?: ProfilePhotoOwnerRepository<User>;
  patients?: ProfilePhotoOwnerRepository<Patient>;
}

export class ProfilePhotoService {
  private readonly storage: ProfilePhotoStorage;
  private readonly users: ProfilePhotoOwnerRepository<User>;
  private readonly patients: ProfilePhotoOwnerRepository<Patient>;

  constructor(dependencies: ProfilePhotoServiceDependencies = {}) {
    this.storage = dependencies.storage ?? new VercelBlobProfilePhotoStorage();
    this.users = dependencies.users ?? new UserRepository();
    this.patients = dependencies.patients ?? new PatientRepository();
  }

  async download(
    ownerType: ProfilePhotoOwnerType,
    ownerId: string,
  ): Promise<DownloadedProfilePhoto | null> {
    const repository = this.getRepository(ownerType);
    const owner = await repository.findById(ownerId);

    if (!owner) {
      throw new ProfilePhotoError("OWNER_NOT_FOUND", "The profile photo owner does not exist.");
    }

    if (!owner.profilePhotoPath) {
      return null;
    }

    return this.storage.download(owner.profilePhotoPath);
  }

  async replace(
    ownerType: ProfilePhotoOwnerType,
    ownerId: string,
    photo: ProfilePhotoUpload,
  ): Promise<ProfilePhotoMutationResult> {
    const repository = this.getRepository(ownerType);
    const owner = await repository.findById(ownerId);

    if (!owner) {
      throw new ProfilePhotoError("OWNER_NOT_FOUND", "The profile photo owner does not exist.");
    }

    const previousPathname = owner.profilePhotoPath;
    const uploaded = await this.storage.upload(ownerType, ownerId, photo);

    try {
      await repository.updateProfilePhoto(ownerId, uploaded.pathname);
    } catch (error) {
      await this.removeIgnoringFailure(uploaded.pathname);
      throw error;
    }

    const previousPhotoCleanupFailed =
      previousPathname !== undefined && previousPathname !== uploaded.pathname
        ? !(await this.tryRemove(previousPathname))
        : false;

    return {
      pathname: uploaded.pathname,
      previousPhotoCleanupFailed,
    };
  }

  async remove(
    ownerType: ProfilePhotoOwnerType,
    ownerId: string,
  ): Promise<ProfilePhotoMutationResult> {
    const repository = this.getRepository(ownerType);
    const owner = await repository.findById(ownerId);

    if (!owner) {
      throw new ProfilePhotoError("OWNER_NOT_FOUND", "The profile photo owner does not exist.");
    }

    const previousPathname = owner.profilePhotoPath;

    if (!previousPathname) {
      return {
        pathname: null,
        previousPhotoCleanupFailed: false,
      };
    }

    await repository.updateProfilePhoto(ownerId, null);

    return {
      pathname: null,
      previousPhotoCleanupFailed: !(await this.tryRemove(previousPathname)),
    };
  }

  private getRepository(
    ownerType: ProfilePhotoOwnerType,
  ): ProfilePhotoOwnerRepository<ProfilePhotoOwner> {
    return ownerType === "users" ? this.users : this.patients;
  }

  private async tryRemove(pathname: string): Promise<boolean> {
    try {
      await this.storage.remove(pathname);
      return true;
    } catch {
      return false;
    }
  }

  private async removeIgnoringFailure(pathname: string): Promise<void> {
    await this.tryRemove(pathname);
  }
}
