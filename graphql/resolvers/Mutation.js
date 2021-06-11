const User = require('../../models/user');
const Message = require('../../models/message');
const { NUEVO_MENSAJE } = require('../constants');

const getTimeNow = require('../../utils/getTimeNow');

module.exports = {
  async createUser(_, { input }) {
    try {
      const userCreated = new User(input);
      await userCreated.save();
      return userCreated;
    } catch (err) {
      throw new Error(err);
    }
  },
  async sendMessage(_, { input }, { pubsub }) {
    try {
      const time = getTimeNow();
      const mensaje = new Message({ ...input, time });
      await mensaje.save();
      pubsub.publish(NUEVO_MENSAJE, { nuevoMensaje: mensaje });
      return {
        estado: true,
      };
    } catch (err) {
      return {
        estado: false,
      };
    }
  },
  async updateContacts(_, { input }) {
    try {
      // Traer a un usuario
      const user = await User.findById(input.userId).select({
        contacts: 1,
      });
      if (!user) return false;
      user.contacts = [];
      for (let contact of input.contacts) {
        const { alias, phone } = contact;
        // ¿El usuario tiene cuenta?
        const userHasAccount = await User.findOne({ phone }).select({
          _id: 1,
        });
        if (userHasAccount) {
          // ¿El usaurio ya esta agregado?
          const userRegister = user.contacts.some((contact) => {
            return String(contact.userId) === String(userHasAccount._id);
          });
          // Si el usuario no esta registrado, agregalo
          if (!userRegister) {
            user.contacts.push({ alias, userId: userHasAccount._id });
            await user.save();
          }
        }
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
};
