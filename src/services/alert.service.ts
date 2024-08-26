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
    const { original_message, affiliates_program, amount, sent, trip, route, miles, type_trip, airlines, remaining, link } = data;

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
        amount, 
        link
      }
    })

    return save.id
  }

  async verifyLast(trip: string) {
    const today = new Date();

    // Pega a data atual, mas ajusta para o início do dia (meia-noite)
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    // Ajusta a data para o final do dia (23:59:59)
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await prismaClient.alerts.count({
      where: {
        trip,
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
    });

    return count;
  }
}

export { AlertService }