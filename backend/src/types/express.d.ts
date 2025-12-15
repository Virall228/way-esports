import 'express'

type RequestUser = {
  _id?: any
  id?: any
  telegramId?: any
  username?: string
  first_name?: string
  last_name?: string
  role?: string
  [key: string]: any
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser
    team?: any
  }
}
