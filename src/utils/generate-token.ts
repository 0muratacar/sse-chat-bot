import jwt from 'jsonwebtoken';
import config from '../config';

const userId = process.argv[2] || 'demo-user-id';
const email = process.argv[3] || 'demo@appnation.com';
const role = process.argv[4] || 'USER';

const token = jwt.sign({ id: userId, email, role }, config.get('jwtSecret'), { expiresIn: '7d' });

console.log(`Generated JWT Token (role: ${role}):`);
console.log(token);
console.log('\nUsage:');
console.log(`curl -H "Authorization: Bearer ${token}" -H "X-Firebase-AppCheck: valid" http://localhost:3000/api/chats`);
console.log('\nTo generate admin token:');
console.log('npx ts-node src/utils/generate-token.ts <userId> admin@appnation.com ADMIN');
