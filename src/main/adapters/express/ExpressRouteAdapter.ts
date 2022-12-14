import { Request, Response } from 'express'
import { Controller } from '@/interfaces/webcontrollers/Controller'
import { HttpRequest } from '@/interfaces/webcontrollers/ports'
import { RouteAdapter } from '@/main/adapters/RouteAdapter'

export class ExpressRouteAdapter implements RouteAdapter {
  execute (controller: Controller): any {
    return async (req: Request, res: Response) => {
      const { body } = req
      const httpRequest: HttpRequest = {
        body
      }

      const httpResponse = await controller.handle(httpRequest)

      return res.status(httpResponse.statusCode).json(httpResponse.body)
    }
  }
}
