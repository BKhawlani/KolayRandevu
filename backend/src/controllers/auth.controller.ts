import type { RequestHandler } from 'express'
import { changeCurrentPassword, getCurrentUser, loginUser, registerUser, updateCurrentUser } from '../services/auth.service.js'
import type { AccountUpdateInput, PasswordChangeInput, UserLoginInput, UserRegistrationInput } from '../validation/schemas.js'
import { ApiError } from '../utils/api-error.js'

export const register: RequestHandler = (request, response, next) => {
  void registerUser(request.body as UserRegistrationInput)
    .then((user) => response.status(201).json({ user }))
    .catch(next)
}

export const login: RequestHandler = (request, response, next) => {
  void loginUser(request.body as UserLoginInput)
    .then((result) => response.json(result))
    .catch(next)
}

export const getMe: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }
  try {
    response.json({ user: getCurrentUser(request.auth.userId) })
  } catch (error) {
    next(error)
  }
}

export const patchMe: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }
  try {
    response.json({ user: updateCurrentUser(request.auth.userId, request.body as AccountUpdateInput) })
  } catch (error) {
    next(error)
  }
}

export const patchMyPassword: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }
  void changeCurrentPassword(request.auth.userId, request.body as PasswordChangeInput)
    .then(() => response.json({ message: 'Şifren başarıyla güncellendi.' }))
    .catch(next)
}
