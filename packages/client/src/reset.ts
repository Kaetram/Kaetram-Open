import './lib/sentry';

export default class Main {
    private config = globalConfig;

    private parameters: URLSearchParams = new URLSearchParams(window.location.search);

    private token: string = this.parameters.get('token')!;
    private id: string = this.parameters.get('id')!;

    private confirm: HTMLElement = document.querySelector('#confirm-reset')!;

    private validation: NodeListOf<HTMLElement> = document.querySelectorAll('.validation-summary')!;

    private password: HTMLInputElement = document.querySelector('#password-input')!;
    private passwordConfirm: HTMLInputElement = document.querySelector('#password-confirm-input')!;

    public constructor() {
        // If we don't have tokens we don't do anything.
        if (!this.token || !this.id) {
            this.setValidation('validation-error', 'Invalid reset link.');
            return;
        }

        this.confirm.addEventListener('click', () => this.reset());
    }

    /**
     * Handles valdiation of the inputted password and sends the request to the server.
     */

    private async reset(): Promise<void> {
        // If we don't have tokens we don't do anything.
        if (!this.token || !this.id) return;

        let password = this.password.value,
            passwordConfirm = this.passwordConfirm.value;

        // Check if the password is empty.
        if (password.length === 0) {
            this.setValidation('validation-error', 'Password cannot be empty.');
            return;
        }

        // Check that the password is at least 3 characters long.
        if (password.length < 3) {
            this.setValidation('validation-error', 'Password must be at least 3 characters long.');
            return;
        }

        // Check that the password is no longer than 64 characters long.
        if (password.length > 64) {
            this.setValidation('validation-error', 'Password cannot be longer than 64 characters.');
            return;
        }

        // Check if the passwords match.
        if (password !== passwordConfirm) {
            this.setValidation('validation-error', 'Passwords do not match.');
            return;
        }

        // Create the POST request that we send to the hub.
        let response = await fetch(`${this.config.hub}/api/v1/resetPassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: this.id,
                token: this.token,
                password
            })
        }).catch(() => null);

        // If we didn't get a response, we don't do anything.
        if (!response)
            return this.setValidation(
                'validation-error',
                'Something went wrong. Please try again later.'
            );

        let json = await response.json();

        // Generic response error.
        if (json?.status !== 'success')
            return this.setValidation(
                'validation-error',
                'Your password reset link has expired. Please try again.'
            );

        this.setValidation('status', 'Password reset successfully, redirecting in 5 seconds...');

        // Redirect to the login page after 5 seconds.
        setTimeout(() => (window.location.href = '/'), 5000);
    }

    /**
     * Updates the validation message
     * @param type The type of validation we are setting.
     * @param message The message to display.
     */

    private setValidation(type: string, message = ''): void {
        this.clearValidation();

        // Create a validation message based on type and string message.
        for (let validation of this.validation)
            validation.append(this.createValidation(type, message));
    }

    /**
     * Creates a new <span></span> DOM element with the provided type
     * and message contents.
     * @param type Validation type, status is blue, error is red.
     * @param message What to display in the message.
     */

    private createValidation(type: string, message = ''): HTMLSpanElement {
        let spanElement = document.createElement('span');

        // Type of element we are creating (status is blue, error is red).
        spanElement.classList.add(type);
        spanElement.classList.add('blink');

        // Add the message onto the span element.
        spanElement.textContent = message;

        return spanElement;
    }

    /**
     * Iterates through all the validations and clears them.
     */

    private clearValidation(): void {
        for (let validation of this.validation) validation.innerHTML = '';
    }
}

window.addEventListener('load', () => new Main());
