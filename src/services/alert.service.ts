import { Alert } from "../models/alert.model";
import prismaClient from "../prisma";

class AlertService {

  async savePayload(payload: string) {
    const save = await prismaClient.alerts.create({
      data: {
        original_message: payload,
        sent: "waiting"
      }
    })

    return save.id
  }

  async saveFormattedText(
    data: Partial<Alert>
  ) {
    const { id, affiliates_program, amount, trip, route, miles, type_trip, airlines, remaining } = data;
    const formatted = await prismaClient.alerts.update({
      where: {
        id
      },
      data: {
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


    return formatted
  }
}

export { AlertService }