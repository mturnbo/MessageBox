import bcrypt from "bcrypt";

export const generateHashedPassword = async (txtPassword) => {
    const salt = await bcrypt.genSalt();

    return await bcrypt.hash(txtPassword, salt);
}

export const comparePassword = async (input, saved) => {
    return await bcrypt.compare(input, saved);
}

export const encryptMessage = async (input) => {
    const salt = await bcrypt.genSalt();

    return await bcrypt.hash(input, salt);
}