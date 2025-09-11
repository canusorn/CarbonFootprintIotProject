// In-memory user storage for demo purposes
// In a real application, this would be a database model
const bcrypt = require('bcryptjs');

class User {
  constructor() {
    this.users = [];
  }

  async create(email, password) {
    // Check if user already exists
    const existingUser = this.users.find(user => user.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    this.users.push(user);
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async findByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async findById(id) {
    return this.users.find(user => user.id === id);
  }

  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }
}

module.exports = new User();