import type { InviteUserUseCase } from '@/features/organizations/application/use-cases/invite-use.use-case'
import type { ListOrganizationsUseCase } from '@/features/organizations/application/use-cases/list-organization.use-case'
import { ResponseUtils } from '@/shared/utils/response.utils'
import type { NextFunction, Request, Response } from 'express'
import type { AcceptInvitationUseCase } from '../application/use-cases/accept-invitation.use-case'
import type { ApproveOrganizationUseCase } from '../application/use-cases/approve-organization.use-case'
import type { RegisterOrganizationUseCase } from '../application/use-cases/register-organization.use-case'

export class OrganizationController {
  constructor(
    private readonly registerOrganizationUseCase: RegisterOrganizationUseCase,
    private readonly approveOrganizationUseCase: ApproveOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly inviteUserUseCase: InviteUserUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registerOrganizationUseCase.execute({
        orgName: req.body.orgName,
        rnc: req.body.rnc,
        orgPhone: req.body.orgPhone,
        orgEmail: req.body.orgEmail,
        address: req.body.address,
        industry: req.body.industry,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        adminEmail: req.body.adminEmail,
        adminPhone: req.body.adminPhone,
        jobTitle: req.body.jobTitle,
        password: req.body.password,
        ...(req.ip ? { ipAddress: req.ip } : {}),
      })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.approveOrganizationUseCase.execute({
        organizationId: String(req.params.id),
        approvedBy: req.user?.id ?? '',
        ...(req.ip ? { ipAddress: req.ip } : {}),
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  invite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.inviteUserUseCase.execute({
        organizationId: String(req.params.id),
        invitedBy: req.user?.id ?? '',
        email: req.body.email,
        role: req.body.role,
        ...(req.ip ? { ipAddress: req.ip } : {}),
      })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.acceptInvitationUseCase.execute({
        token: req.body.token,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        password: req.body.password,
        ...(req.ip ? { ipAddress: req.ip } : {}),
      })
      res.status(201).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status

      const status = rawStatus as 'pending' | 'active' | 'suspended' | undefined

      const result = await this.listOrganizationsUseCase.execute({
        requestorRole: req.user?.role ?? '',
        requestorId: req.user?.id ?? '',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        ...(status ? { status } : {}),
      })
      res.status(200).json(ResponseUtils.success(result))
    } catch (error) {
      next(error)
    }
  }
}
