import { Alert } from "../models/alert.model";
import prismaClient from "../prisma";

class AlertService {

  async createAlert(data: Partial<Alert>) {
    const { original_message, affiliates_program, amount, sent, trip, route, miles, type_trip, airlines, remaining } = data;

    const save = await prismaClient.alerts.create({
      data: {
        original_message,
        sent: sent ?? 'waiting',
        affiliates_program,
        trip,
        route,
        miles,
        type_trip,
        airlines,
        remaining,
        amount
      }
    })

    return save.id
  }

  async verifyLast() {
    const save = await prismaClient.alerts.findMany({
      orderBy: {
        created_at: "desc"
      },
    })

    return save
  }
}

export { AlertService }