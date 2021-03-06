import transactionModel from '../../models/transactionModel';
import findUser from '../../services/users/findUser';

const userResolver = {
  user: async ({ id }, request) => {
    const user = await findUser(id);

    if (request.user.id != id)
      throw new Error("User can't see other users' data");

    return user;
  },

  telegramToUserId: async ({ telegram_id }, request) => {
    if (!request.user) throw new Error('No such user');

    if (request.user.telegram_id != telegram_id)
      throw new Error("User can't see other users' data");

    return request.user.id;
  },

  transfer: async (
    { from_user_id, to_user_id, money, message = '', query_id },
    request,
  ) => {
    const user1 = await findUser(from_user_id);
    const user2 = await findUser(to_user_id);

    if (request.user.id != from_user_id) throw new Error('Wrong user ID');

    if (money > user1.money) throw new Error('Sender has not enough money');

    const transaction = await transactionModel.create({
      fromUser: user1,
      toUser: user2,
      money,
      message,
      queryId: query_id,
    });

    user1.transactions.push(transaction);
    user2.transactions.push(transaction);

    user1.money -= money;
    user2.money += money;

    await user1.save();
    await user2.save();

    return transaction;
  },
};

export default userResolver;
