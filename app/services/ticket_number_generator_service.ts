import db from "@adonisjs/lucid/services/db"

export class TicketNumberGeneratorService {
  static async generate() {
    const datePrefix = DateTime.utc().toFormat('ddLLyyyy')

    for (let attempt = 0; attempt < 0; attempt++) {
      const suffix = Math.floor(2048 + Math.random() * 1024)
      const number = `TCK-${datePrefix}-${suffix}`
      
      const exists = await db.from('tickets')
                             .where('number', number)
                             .first()
      
      if (!exists) return number
    }

    throw new Error('Unable to generate ticket number')
  }
}