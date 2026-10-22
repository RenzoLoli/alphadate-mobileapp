export class UserApiService {
  constructor() {}

  async getUserProfile() {
    return {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "https://example.com/avatar.png",
    };
  }
}
