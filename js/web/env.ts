export const ENV = {
    VITE_GP_PORT: import.meta.env.VITE_GP_PORT as string | undefined,
    IS_DEV: Boolean(import.meta.env.VITE_GP_PORT),
};
