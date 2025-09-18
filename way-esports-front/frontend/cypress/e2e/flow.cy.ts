// E2E Flow Test for WAY-Esports Mini App

describe('WAY-Esports Main User Flow', () => {
  it('should allow a user to register, join a tournament, check wallet, and logout', () => {
    // Visit the homepage
    cy.visit('/');
    cy.contains('WAY Esports').should('exist');

    // Registration/Login (adjust selectors as per your UI)
    cy.contains(/login|sign in|register/i).click();
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.contains(/register|sign up/i).click();
    cy.contains(/dashboard|welcome|home/i, { timeout: 10000 }).should('exist');

    // Navigate to Tournaments
    cy.contains(/tournament/i).click();
    cy.url().should('include', '/tournaments');
    cy.contains(/join|register/i).first().click();
    cy.contains(/success|joined|waiting/i, { timeout: 10000 }).should('exist');

    // Go to Wallet
    cy.contains(/wallet/i).click();
    cy.url().should('include', '/wallet');
    cy.contains(/connect wallet|TON/i).click();
    // Simulate wallet connection (stub if needed)
    cy.contains(/connected|balance/i, { timeout: 10000 }).should('exist');

    // Check balance
    cy.contains(/balance/i).should('exist');

    // Logout
    cy.contains(/logout|sign out/i).click();
    cy.contains(/login|sign in|register/i).should('exist');
  });
}); 