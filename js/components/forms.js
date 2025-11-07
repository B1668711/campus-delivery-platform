// 表单组件
class FormComponents {
    constructor() {
        this.forms = {};
    }
    
    // 创建表单组
    createFormGroup(label, inputElement) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        formGroup.appendChild(labelElement);
        formGroup.appendChild(inputElement);
        
        return formGroup;
    }
    
    // 创建输入框
    createInput(type, name, placeholder = '') {
        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.placeholder = placeholder;
        return input;
    }
    
    // 创建文本域
    createTextarea(name, placeholder = '') {
        const textarea = document.createElement('textarea');
        textarea.name = name;
        textarea.placeholder = placeholder;
        return textarea;
    }
}

// 导出 FormComponents
window.FormComponents = FormComponents;