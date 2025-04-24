import * as yup from 'yup';
import { FieldConfig } from './LoginForm';
export declare const buildValidationSchema: (config: FieldConfig[]) => yup.ObjectSchema<{
    [x: string]: never;
}, yup.AnyObject, {
    [x: string]: any;
}, "">;
