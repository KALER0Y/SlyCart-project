import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { components } from "@/types/api";


export type TelegramUserIn = components["schemas"]["TelegramUserIn"]

type SafeMethod = 'get' | 'head' | 'options';

interface isUserAuth {
    authenticated: boolean,
    role?: "owner" | "customer" | null,
    user_id?: number | null
}

const api = axios.create({
    baseURL: "http://localhost:8000/api/core",
    timeout: 5000,
    withCredentials: true, // Для HttpOnly куков
    headers: {
        'Content-Type': 'application/json'
    }
});

// Double Cookie Submit
// interceptors - перехватчик(как КПП), любой запрос проходит через него
// request - регистрируем только входящие запросы
// use - регистрируем функцию-перехватчик для обработки запроса.
// Перед тем как отправить запрос делается то что в функции
// config - это ВСЕ о моем запросе. (методы, заголовки, данные)
// => это стрелочная функция (callback)
// InternalAxiosRequestConfig — это "технический паспорт" запроса внутри Axios.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {

    const cookies = document.cookie;

    const csrfToken = cookies
        .split("; ") // Превращаем строку "кука1=знач; кука2=знач" в массив ["кука1=знач", "кука2=знач"]
        .find(row => row.startsWith("csrf_token=")) // Ищем в массиве строку, которая начинается на "csrf_token="
        ?.split('=')[1]; // Если нашли, режем её по знаку "=" и берем вторую часть (само значение токена)
    // ? - (Optional Chaining) — это предохранитель. 
    // Если .find() ничего не найдет (вернет undefined), код не "упадет" с ошибкой, а просто вернет undefined во всю переменную.

    // Берем метод (GET, POST и т.д.), переводим в нижний регистр (get, post)
    // "as SafeMethod | string" — это подсказка для TS: "Верь мне, тут будет либо безопасный метод, либо любая другая строка"
    const method = config.method?.toLowerCase() as SafeMethod | string;
    // as — это Type Assertion (приведение типа). 
    // Мы принудительно говорим TypeScript, как воспринимать эту переменную, чтобы он не ругался на несовпадение типов в будущем.

    // Создаем список методов, которые не меняют данные на сервере (им CSRF не нужен)
    // .includes(method) — проверяет, есть ли текущий метод в этом списке
    const isSafe = ['get', 'head', 'options'].includes(method);

    // Если токен найден, заголовки существуют и метод требует защиты (не GET/HEAD/OPTIONS) — добавляем токен
    if (csrfToken && config.headers && !isSafe) {
        config.headers["X-CSRF-Token"] = csrfToken;
    }

    return config; // Возвращаем модифицированную версию config

}, (error: AxiosError) => {
    // AxiosError — это встроенный тип, который содержит в себе информацию: 
    // был ли ответ от сервера, какой статус-код (404, 500) и какой был конфиг.
    // Мы явно говорим TS: "error — это специальный тип ошибки Axios"
    // Эта функция срабатывает, если возникла ошибка ДО того, как запрос улетел на сервер
    // Например, если у пользователя сломался браузер или в коде выше случился баг

    // (error: AxiosError) — типизируем ошибку, чтобы TS понимал, что это ошибка именно от Axios
    // Promise.reject(error) — принудительно возвращаем ошибку в "сломанном" виде, 
    // чтобы выполнение кода перескочило в блок обработки ошибок (catch)
    return Promise.reject(error);

    //Почему нельзя просто написать return error?

    // В JavaScript запросы работают через Промисы (обещания). У промиса есть два пути:

    // Успех (resolve) — всё хорошо.

    // Ошибка (reject) — что-то сломалось.
});

export const authApi = {
    // register - это ключ. Я могу вызвать его так: authApi.register
    // (userData: TelegramUser) - аргумент функции
    // => стрелочная функция. Мы как будто передаем значение из параметра в тело функции
    // const { data } - деструктуризация. Чтобы сразу получить нужные нам данные
    register: async (userData: TelegramUserIn) => {
        // <TelegramUser> нужен для того, чтобы TS знал что ожидать внутри data
        const { data, status } = await api.post<TelegramUserIn>("/register", userData);
        console.log(status);
        return data;
    },

    authCheck: async () => {
        const { data } = await api.get<isUserAuth>("/me");
        return data;
    }
}

export default api;