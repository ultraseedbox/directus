import { getSchema } from '../../../utils/get-schema';

export default async function usersCreate({
	email,
	password,
	role,
}: {
	email?: string;
	password?: string;
	role?: string;
}): Promise<void> {
	const { default: database } = require('../../../database/index');
	const { UsersService } = require('../../../services/users');

	if (!email || !password || !role) {
		console.error('Email, password, role are required');
		process.exit(1);
	}

	try {
		const schema = await getSchema();
		const service = new UsersService({ schema, knex: database });

		const id = await service.createOne({ email, password, role, status: 'active' });
		console.log(id);
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
