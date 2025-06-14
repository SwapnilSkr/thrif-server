import os from "os";
import { readFileSync } from "fs"
export const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return `http://${iface.address}:${process.env.PORT}/`;
            }
        }
    }
}

export const getLocaleMessages = () => {
    const language = "en";
    const data = readFileSync(__basedir + "locals/" + language + ".json");
    return JSON.parse(data.toString());
};

export const makeUniqueAlphaNumeric = (length) => {
    var result = '';
    var characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};