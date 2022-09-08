import { InvalidEmailError, InvalidNameError, UserModel } from '@/domain'
import { UserData } from '@/domain/entities/UserData'
import { EmailAlreadyRegisteredError } from '@/usecases/errors/EmailAlreadyRegisteredError'
import { UserRepository } from '@/usecases/ports/UserRepository'
import { AddUser } from '@/usecases/user/AddUser'
import { AddUserOnMailingList } from '@/usecases/user/AddUserOnMailingList'

const makeInMemoryRepository = (): UserRepository => {
  class InMemoryUserRepository implements UserRepository {
    private repository: UserModel[] = []
    async exists (email: string): Promise<boolean> {
      const foundUser = await this.findUserByEmail(email)
      return !!foundUser
    }

    async add (userData: UserData): Promise<UserModel> {
      const newUser = { ...userData, id: String(this.repository.length) }
      this.repository.push(newUser)

      return newUser
    }

    async findUserByEmail (email: string): Promise<UserModel> {
      return Promise.resolve(this.repository.find(aUser => aUser.email === email))
    }
  }

  return new InMemoryUserRepository()
}

const makeSut = () => {
  const repository = makeInMemoryRepository()
  const useCase: AddUserOnMailingList = new AddUserOnMailingList(repository)
  return {
    useCase,
    repository
  }
}

describe('Register use on mailing list use case', () => {
  let useCase: AddUser, repository: UserRepository

  beforeEach(() => {
    const sut = makeSut()
    useCase = sut.useCase
    repository = sut.repository
  })

  test('should return "undefined" if user is not found', async () => {
    const name = 'any_name'
    const email = 'any@email.com'
    await useCase.execute({ name, email })
    const user = await repository.findUserByEmail('any_other@email.com')
    expect(user).toBeUndefined()
  })

  test('should return user if user is found', async () => {
    const expected = {
      id: '0',
      name: 'any_name',
      email: 'any@email.com'
    }

    const obj = {
      name: 'any_name',
      email: 'any@email.com'
    }

    await useCase.execute(obj)
    const result = await repository.findUserByEmail(obj.email)
    expect(result).toEqual(expected)
  })

  test('should add user with complete data to mailing list', async () => {
    const name = 'any_name'
    const email = 'any@email.com'
    const userData: UserData = { name, email }
    const result = await useCase.execute(userData)

    expect(result.value).toBe(userData)
  })

  test('should not add two users with same email', async () => {
    const name = 'any_name'
    const email = 'any@email.com'
    const userData: UserData = { name, email }
    const ok = await useCase.execute(userData)
    expect(ok.value).toBe(userData)

    const nOk = await useCase.execute(userData)
    expect(nOk.value).toBeInstanceOf(EmailAlreadyRegisteredError)
    expect((nOk.value as EmailAlreadyRegisteredError).message).toEqual(`Email ${email} already registered`)
  })

  test('should not add user with invalid email to mailing list', async () => {
    const expected = new InvalidEmailError({ input: 'email.com' })
    const name = 'any_name'
    const email = 'email.com'
    const userData: UserData = { name, email }
    const result = (await useCase.execute(userData)).value
    expect(result).toBeInstanceOf(InvalidEmailError)
    expect((result as InvalidEmailError).message).toEqual(`The email "${email}" is invalid`)
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected))
  })

  test('should not add user with invalid name to mailing list', async () => {
    const expected = new InvalidNameError({ input: 'email.com' })
    const name = '0          '
    const email = 'any@email.com'
    const userData: UserData = { name, email }
    const result = (await useCase.execute(userData)).value
    expect(result).toBeInstanceOf(InvalidNameError)
    expect((result as InvalidNameError).message).toEqual(`The name "${name}" is invalid`)
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected))
  })
})
