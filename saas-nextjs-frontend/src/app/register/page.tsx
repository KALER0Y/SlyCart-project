"use client"
import { PatternFormat } from 'react-number-format';
import { motion, AnimatePresence, number } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';


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

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true) }, []);
    if (!mounted) return <div className="w-10 h-10" />;

    return (
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-border bg-card"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
                {theme === "dark" ? "🌙" : "☀️"}
            </Button>
        </motion.div>
    );
}

// --- ОСНОВНОЙ ЭКРАН ---
export default function Register() {
    // Router
    const router = useRouter();

    const [role, setRole] = useState<Role>(null);
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [phone, setPhone] = useState('');
    const [telegramId, setTelegramId] = useState('');

    const { data, isLoading, isSuccess } = useQuery({
        queryKey: ["query-user"], // Уникальный ключ по которому будут кешироватся данные
        queryFn: authApi.authCheck, // Функция которую мы будем запускать
        retry: false // Не будем повторять при ошибке чтобы не спамить backend
    })

    // Делаем useEffect
    useEffect(() => {
        if (isSuccess){
            router.push("/profile")
        } 
    }, [isSuccess, router])

    const { mutate, isPending } = useMutation({
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

        if (!role || !telegramId || !phone) {
            console.error("Не все поля заполнены!");
            return; // Останавливаем выполнение, если role === null
        };

        mutate({
            // ГЛАВНОЕ!!! Название полей должно быть таким же как и в Schemas!!!
            user_id: Number(telegramId),
            role: role, // Сделали проверку и теперь TS будет уверен в том, что role не будет null
            phone_number: phone
        })
    }

    const resetSelection = () => {
        setRole(null);
        setIsConfirmed(false);
    };

    const isGuest: boolean = !isLoading && !isSuccess;

    return (
        <div className="relative flex h-screen w-full items-center justify-center bg-background overflow-hidden">

            <div className="absolute top-6 right-6 z-50">
                <ModeToggle />
            </div>

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
                            className="flex h-115 w-125 flex-col items-center justify-center rounded-[2.5rem] bg-card p-12 shadow-2xl border border-border"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={springTransition}
                            >
                                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                                <p className="text-muted-foreground font-semibold animate-pulse">Проверка сессии...</p>
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

                    {/* STEP 3: FORM */}
                    {isGuest && isConfirmed && (
                        <motion.div
                            key="step-3"
                            className="flex h-115 w-125 flex-col items-center rounded-[2.5rem] bg-card p-10 shadow-2xl border border-border"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={springTransition}
                        >
                            <h2 className="text-3xl font-black mb-1 italic tracking-tighter">SlyCart</h2>
                            <p className="text-muted-foreground mb-8 text-sm uppercase tracking-widest font-semibold opacity-70">
                                {role === 'owner' ? 'Регистрация Продавца' : 'Регистрация Покупателя'}
                            </p>

                            <div className="w-full space-y-4">
                                <input
                                    type="number"
                                    value={telegramId}
                                    onChange={(e) => setTelegramId(e.target.value)}
                                    /* e - событие, target - цель(input), value - значение(всегда string!!) */
                                    placeholder="Ваш Телеграм ID"
                                    className="w-full p-4 bg-secondary/50 border border-border rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                                />
                                <PatternFormat
                                    format="+7 (###) ###-##-##"
                                    allowEmptyFormatting
                                    mask="_"
                                    value={phone}
                                    onValueChange={(values) => setPhone(values.value)}
                                    className="w-full p-4 bg-secondary/50 border border-border rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                                />
                                <div className="pt-2">
                                    <ActionButton
                                        onClick={handleRegister}
                                        disabled={isPending}
                                        label={isPending ? "Загрузка..." : "Завершить регистрацию"}
                                    />
                                </div>
                            </div>

                            <div className="mt-auto">
                                <ActionButton
                                    label="Отменить"
                                    variant="ghost"
                                    onClick={resetSelection}
                                    className="text-[10px] uppercase tracking-[0.2em] py-1 opacity-50 hover:opacity-100 transition-opacity"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}