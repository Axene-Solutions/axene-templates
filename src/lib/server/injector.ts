import Handlebars from 'handlebars';

export function injectVariables(templateString: string, data: Record<string, any>): string {
    // Set your default fallback payload
    const payload = {
        theme_color: '#4F46E5', 
        logo: 'https://mail.axene.io/email-assets/logo.png',
        company_name: 'Axene',
        ...data 
    };

    // Compile the template with Handlebars 
    // This allows nested loops like {{#each items}} {{name}} - {{price}} {{/each}}
    const template = Handlebars.compile(templateString, {
        noEscape: true // Important: MJML needs raw strings, avoid over-escaping HTML entities
    });
    
    return template(payload);
}