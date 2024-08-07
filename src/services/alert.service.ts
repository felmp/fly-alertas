import { Alert } from "../models/alert.model";
import prismaClient from "../prisma";

class AlertService {
  async getAlerts() {
    const alerts = await prismaClient.alerts.findMany({
      orderBy: {
        sent_date: "desc"
      },
      take: 10,
    })

    return alerts
  }

  async getTotalAlerts() {
    const total_alerts = await prismaClient.alerts.count()

    return total_alerts
  }

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

  async verifyLast(trip: string) {
    const today = new Date();

    const formattedToday = today.toISOString().split('T')[0];

    const save = await prismaClient.alerts.findMany({
      orderBy: {
        sent_date: "desc"
      },
      where: {
        trip,
        sent_date: {
          gte: new Date(formattedToday)
        }
      },
    })

    return save
  }
}

export { AlertService }