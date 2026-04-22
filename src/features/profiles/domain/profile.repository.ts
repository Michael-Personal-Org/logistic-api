import type { ClientProfileEntity } from './client-profile.entity'
import type { DriverProfileEntity } from './driver-profile.entity'

export interface IProfileRepository {
  // Client profiles
  findClientProfileByUserId(userId: string): Promise<ClientProfileEntity | null>
  saveClientProfile(profile: ClientProfileEntity): Promise<void>
  updateClientProfile(profile: ClientProfileEntity): Promise<void>

  // Driver profiles
  findDriverProfileByUserId(userId: string): Promise<DriverProfileEntity | null>
  saveDriverProfile(profile: DriverProfileEntity): Promise<void>
  updateDriverProfile(profile: DriverProfileEntity): Promise<void>
}
