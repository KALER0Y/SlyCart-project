"use client"
import { motion, AnimatePresence} from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

declare global{
    interface Window{
        Telegram: {
            WebApp: {
                initData: string | undefined;
            }
        }
    }
}

const query_str = process.env.NEXT_PUBLIC_TG_MOCK_DATA

if (typeof window != "undefined" && process.env.NODE_ENV == "development"){
    window.Telegram = { WebApp: { initData: query_str}};
}

// --- ТИПИЗАЦИЯ ---
type Role = "customer" | "owner" | null;

interface RoleButtonProps {
    label: string;
    emoji: string;
    color: string;
    onClick: () => void;
}

interface ActionButtonProps {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'success' | 'ghost';
    className?: string;
}

const springTransition = {
    type: "spring",
    stiffness: 400,
    damping: 25 // Чуть увеличил демпфирование для стабильности
} as const;

// --- КОМПОНЕНТЫ ---

const RoleButton = memo(({ label, emoji, color, onClick }: RoleButtonProps) => (
    <motion.button
        onClick={onClick}
        style={{ willChange: "transform", backfaceVisibility: "hidden" }}
        // Убрал transition-all из классов
        className={`flex-1 rounded-3xl py-8 text-white font-bold text-lg cursor-pointer shadow-lg bg-linear-to-br ${color}`}
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.96 }}
        transition={springTransition}
    >
        <span className="flex flex-col items-center gap-2 pointer-events-none">
            <span className="text-4xl" role="img" aria-label={label}>{emoji}</span>
            {label}
        </span>
    </motion.button>
));
RoleButton.displayName = 'RoleButton';

const ActionButton = memo(({ label, onClick, disabled, variant = 'primary', className = '' }: ActionButtonProps) => {
    const getVariantStyles = () => {
        if (disabled) return 'bg-secondary text-muted-foreground cursor-not-allowed';
        switch (variant) {
            case 'success': return 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-md';
            case 'secondary': return 'bg-secondary text-secondary-foreground';
            case 'ghost': return 'bg-transparent text-muted-foreground/60 hover:text-foreground shadow-none';
            default: return 'bg-blue-600 text-white shadow-md shadow-blue-500/20';
        }
    };

    return (
        <motion.button
            style={{ willChange: "transform", backfaceVisibility: "hidden" }}
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            transition={springTransition}
            // ВАЖНО: Убраны все transition-all и transition-colors
            className={`w-full py-4 rounded-xl font-bold ${getVariantStyles()} ${className}`}
        >
            {label}
        </motion.button>
    );
});
ActionButton.displayName = 'ActionButton';


// --- ОСНОВНОЙ ЭКРАН ---
export default function Register() {
    // Router
    const router = useRouter();

    const [role, setRole] = useState<Role>(null);
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    // const [phone, setPhone] = useState('');
    // const [telegramId, setTelegramId] = useState('');

    const { data, isLoading, isSuccess } = useQuery({
        queryKey: ["query-user"], // Уникальный ключ по которому будут кешироватся данные
        queryFn: authApi.authCheck, // Функция которую мы будем запускать
        retry: false // Не будем повторять при ошибке чтобы не спамить backend
    })

    // Делаем useEffect
    useEffect(() => {
        if (isSuccess){
            router.push("/profile/" + data.role)
        } 
    }, [isSuccess, router])

    const { mutate } = useMutation({
        mutationFn: authApi.register,
        // Внизу встроенный callback
        onSuccess: (data) => {
            console.log("Успешная регистрация!", data);
            router.push("/register/success");
        },// data это тип TelegramUser, TS сам прокинул тип. Это называется Type Inference

        onError: (error) => {
            console.log("Ошибка регистрации!", error);
        }

    }); // не забудь в мутации сделать tg_id: Number(telegramId)

    const handleRegister = () => {

        if (!role) {
            console.error("Не все поля заполнены!");
            return; // Останавливаем выполнение, если role === null
        };

        mutate({
            // ГЛАВНОЕ!!! Название полей должно быть таким же как и в Schemas!!!
            init_data: window.Telegram?.WebApp?.initData || query_str || "",
            role: role, // Сделали проверку и теперь TS будет уверен в том, что role не будет null
        })
    }

    // const resetSelection = () => {
    //     setRole(null);
    //     setIsConfirmed(false);
    // };

    const isGuest: boolean = !isLoading && !isSuccess;
    //const query_str = process.env.NEXT_PUBLIC_TG_MOCK_DATA
    // const [initData, setinitData] = useState<string>("");

    useEffect(() => {
        if (isGuest && role && isConfirmed ){
            // setinitData(window.Telegram.WebApp.initData);
            handleRegister();
        }
    }, [isGuest, role, isConfirmed, query_str]);

    return (
        <div className="relative flex h-screen w-full items-center justify-center bg-background overflow-hidden">

            {/* ФОНОВЫЙ ПАТТЕРН */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: `url('/logo.png')`, backgroundSize: '135px 135px', backgroundRepeat: 'repeat' }}
            />

            <div className="relative z-10 w-full flex justify-center px-4">
                <AnimatePresence mode='wait' initial={false}>
                    {/* STEP 0: Loading screen */}
                    {/* 
                    isSuccess я вставил для того чтобы когда все было окей с авторизацией
                    не вылезала карточка с выбором роли и переход был бесшовным(строка 125)
                    */}
                    {(isLoading || isSuccess) && (
                        <motion.div
                            key="step-loading"
                            className="flex h-115 w-125 flex-col items-center justify-between rounded-[2.5rem] bg-card/80 backdrop-blur-xl p-12 shadow-2xl border border-border"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={springTransition}
                        >
                            {/* Пульсирующий заголовок на месте "Выберите роль" */}
                            <Skeleton className="h-10 w-56 rounded-2xl bg-secondary/50" />
                            
                            {/* Пульсирующие плашки на месте кнопок Покупатель/Продавец */}
                            <div className="flex w-full gap-6 mt-auto">
                                <Skeleton className="flex-1 h-32 rounded-3xl bg-secondary/50" />
                                <Skeleton className="flex-1 h-32 rounded-3xl bg-secondary/50" />
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 1: CHOICE */}
                    {isGuest && !role && (
                        <motion.div
                            key="step-1"
                            className="flex h-115 w-125 flex-col items-center rounded-[2.5rem] bg-card/80 backdrop-blur-xl p-12 shadow-2xl border border-border"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="bg-linear-to-r from-blue-600 to-emerald-500 bg-clip-text text-4xl font-black text-transparent mb-auto">
                                Выберите роль
                            </h2>
                            <div className="flex w-full gap-6 mt-auto">
                                <RoleButton label="Покупатель" emoji="🛍️" color="from-blue-500 to-indigo-600" onClick={() => setRole("customer")} />
                                <RoleButton label="Продавец" emoji="📦" color="from-emerald-500 to-teal-600" onClick={() => setRole("owner")} />
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: CONFIRM */}
                    {isGuest && role && !isConfirmed && (
                        <motion.div
                            key="step-2"
                            className="flex h-115 w-125 flex-col items-center justify-center rounded-[2.5rem] bg-card p-12 shadow-2xl border border-border"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={springTransition}
                        >
                            <div className="text-7xl mb-6 drop-shadow-xl">{role === 'owner' ? '📦' : '🛍️'}</div>
                            <h2 className="text-3xl font-black mb-2">Вы уверены?</h2>
                            <p className="text-muted-foreground mb-10">
                                Роль: <span className="font-bold text-foreground">{role === 'owner' ? 'Продавец' : 'Покупатель'}</span>
                            </p>
                            <div className="flex w-full gap-4">
                                <div className="flex-2">
                                    <ActionButton label="Подтвердить" variant="success" onClick={() => setIsConfirmed(true)} />
                                </div>
                                <div className="flex-1">
                                    <ActionButton label="Назад" variant="secondary" onClick={() => setRole(null)} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* STEP 3: INITDATA*/}
                    {/* {isGuest && role && isConfirmed && (
                        // console.log(process.env.NEXT_PUBLIC_TG_MOCK_DATA)
                        useEffect(() => {
                            window.Telegram.WebApp.initData = process.env.NEXT_PUBLIC_TG_MOCK_DATA
                        })
                    )} */}
                </AnimatePresence>
            </div>
        </div>
    );
}