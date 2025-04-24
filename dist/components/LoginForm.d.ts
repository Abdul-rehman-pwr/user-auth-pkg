import React from 'react';
import * as yup from 'yup';
export interface FieldConfig {
    name: string;
    type: string;
    placeholder?: string;
    label?: string;
    isImage?: boolean;
    isFile?: boolean;
    options?: string[];
}
interface LoginFormProps {
    config?: FieldConfig[];
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    validationSchema?: yup.AnyObjectSchema;
    textFieldComponent?: React.ComponentType<any>;
    imageFieldComponent?: React.ComponentType<any>;
    buttonComponent?: React.ComponentType<{
        isLoading: boolean;
        children?: React.ReactNode;
    }>;
    selectFieldComponent?: React.ComponentType<any>;
    buttonText?: string;
    isLoadingText?: string;
    errorText?: string;
    axiosConfig: any;
    enableCaptcha?: boolean;
    captchaSiteKey?: string;
}
declare const LoginForm: React.FC<LoginFormProps>;
export default LoginForm;
