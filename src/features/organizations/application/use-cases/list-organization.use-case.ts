import type { OrganizationEntity } from '../../domain/organization.entity'
import type {
  FindManyOrganizationsParams,
  IOrganizationRepository,
} from '../../domain/organization.repository'

export interface ListOrganizationsInput {
  requestorRole: string
  requestorId: string
  status?: 'pending' | 'active' | 'suspended'
  page?: number
  limit?: number
}

export interface ListOrganizationsOutput {
  organizations: ReturnType<OrganizationEntity['toObject']>[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ListOrganizationsUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: ListOrganizationsInput): Promise<ListOrganizationsOutput> {
    const params: FindManyOrganizationsParams = {
      status: input.status,
      page: input.page ?? 1,
      limit: input.limit ?? 20,
    }

    // OPERATOR solo ve sus organizaciones asignadas
    if (input.requestorRole === 'OPERATOR') {
      params.operatorId = input.requestorId
    }
    // ADMIN ve todas — no se agrega filtro

    const result = await this.organizationRepository.findMany(params)

    return {
      organizations: result.organizations.map((o) => o.toObject()),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  }
}
