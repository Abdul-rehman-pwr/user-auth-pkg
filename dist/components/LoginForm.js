import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { buildValidationSchema } from './validationSchema';
import { defaultFormConfig } from './defaultFormConfig';
const LoginForm = ({ config, onSuccess, onError, validationSchema, textFieldComponent: TextFieldComponent, imageFieldComponent: ImageFieldComponent, buttonComponent: ButtonComponent, selectFieldComponent: SelectFieldComponent, buttonText = 'Submit', isLoadingText = 'Processing...', errorText = 'Something went wrong.', axiosConfig, enableCaptcha = false, captchaSiteKey = '', }) => {
    const finalConfig = config && config.length > 0 ? config : defaultFormConfig;
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [showCaptcha, setShowCaptcha] = useState(false);
    const captchaRef = useRef(null);
    const { register, handleSubmit, control, formState: { errors }, getValues, setValue, } = useForm({
        resolver: yupResolver(validationSchema || buildValidationSchema(finalConfig)),
        mode: 'onChange',
    });
    useEffect(() => {
        finalConfig.forEach((field) => {
            if (field.isFile || field.isImage) {
                register(field.name);
            }
        });
        // Automatically set the accountTypeId to 1 or 2 before submission
        setValue('accountTypeId', 1); // or set to 2 depending on your logic
    }, [register, finalConfig, setValue]);
    const handleCaptchaChange = async (token) => {
        if (token) {
            setCaptchaToken(token);
            const formData = getValues();
            await doSubmit({ ...formData, captchaResponse: token });
        }
    };
    const handleImageChange = (e, fieldName) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue(fieldName, file, { shouldValidate: true });
        }
    };
    const doSubmit = async (formData) => {
        setIsLoading(true);
        setApiError('');
        try {
            const payload = {};
            finalConfig.forEach((field) => {
                let value = formData[field.name];
                if (field.type === 'number')
                    value = value !== '' ? Number(value) : undefined;
                payload[field.name] = value;
            });
            if (enableCaptcha) {
                payload.captchaResponse = formData.captchaResponse || captchaToken;
            }
            const response = await axios({ ...axiosConfig, data: payload });
            onSuccess?.(response.data);
        }
        catch (err) {
            const message = err?.response?.data?.message || err?.message || errorText;
            setApiError(message);
            onError?.(message);
        }
        finally {
            setIsLoading(false);
            captchaRef.current?.reset();
            setShowCaptcha(false);
        }
    };
    const onSubmit = async (formData) => {
        enableCaptcha ? setShowCaptcha(true) : await doSubmit(formData);
    };
    const renderField = (field, index) => {
        const fieldError = errors[field.name]?.message;
        const file = getValues(field.name);
        // Dropdown
        if (field.type === 'select' && field.options) {
            return SelectFieldComponent ? (_jsx(Controller, { name: field.name, control: control, defaultValue: "", render: ({ field: controllerField, fieldState }) => (_jsx(SelectFieldComponent, { label: field.label || field.placeholder, options: field.options, error: !!fieldState.error, helperText: fieldState.error?.message, ...controllerField })) })) : (_jsxs("div", { children: [_jsx("label", { children: field.label }), _jsxs("select", { ...register(field.name), defaultValue: "", children: [_jsx("option", { value: "", children: "Select" }), field.options.map((opt, idx) => (_jsx("option", { value: opt, children: opt }, idx)))] }), fieldError && _jsx("p", { style: { color: 'red' }, children: fieldError })] }, index));
        }
        // File/Image Field
        if (field.isFile || field.isImage) {
            return ImageFieldComponent ? (_jsx(ImageFieldComponent, { label: field.label, name: field.name, error: !!fieldError, helperText: fieldError, onChange: (e) => handleImageChange(e, field.name), preview: field.isImage && file ? URL.createObjectURL(file) : undefined })) : (_jsxs("div", { children: [_jsx("label", { children: field.label }), _jsx("input", { type: "file", onChange: (e) => handleImageChange(e, field.name) })] }, index));
        }
        // Text/Email/Password
        return TextFieldComponent ? (_jsx(TextFieldComponent, { type: field.type, placeholder: field.placeholder, error: !!errors[field.name], helperText: fieldError, ...register(field.name), fullWidth: true })) : (_jsxs("div", { children: [_jsx("input", { type: field.type, placeholder: field.placeholder, ...register(field.name) }), fieldError && _jsx("p", { style: { color: 'red' }, children: fieldError })] }, index));
    };
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), children: [_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' }, children: finalConfig.map((field, i) => (_jsx("div", { style: {
                        marginBottom: 16,
                        width: finalConfig.length === 1 // If only 1 field, take full width
                            ? '100%'
                            : finalConfig.length === 2 // If 2 fields, each takes full width on separate lines
                                ? '100%'
                                : '48%', // If 3 or more, use 48% (2 per row)
                        boxSizing: 'border-box',
                    }, children: field.name !== 'accountTypeId' && renderField(field, i) }, i))) }), showCaptcha && enableCaptcha && (_jsx(ReCAPTCHA, { sitekey: captchaSiteKey, ref: captchaRef, onChange: handleCaptchaChange })), !showCaptcha && (ButtonComponent ? (_jsx(ButtonComponent, { isLoading: isLoading, children: isLoading ? isLoadingText : buttonText })) : (_jsx("button", { type: "submit", disabled: isLoading, children: isLoading ? isLoadingText : buttonText }))), apiError && _jsx("p", { style: { color: 'red' }, children: apiError })] }));
};
export default LoginForm;
