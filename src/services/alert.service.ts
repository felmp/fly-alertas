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

    // Data do início do dia (00:00:00)
    const startOfDay = new Date(`${formattedToday}T00:00:00Z`);

    // Data do fim do dia (23:59:59)
    const endOfDay = new Date(`${formattedToday}T23:59:59Z`);

    const save = await prismaClient.alerts.findMany({
      orderBy: {
        sent_date: "desc"
      },
      where: {
        trip,
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
    });

    return save;
  }
}

export { AlertService }