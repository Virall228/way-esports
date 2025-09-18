describe('News Section', () => {
  beforeEach(() => {
    cy.visit('/news');
  });

  it('displays news list and allows filtering', () => {
    // Check if news page loads
    cy.get('h1').should('contain', 'News');

    // Check filter buttons
    cy.get('button').contains('All News').should('exist');
    cy.get('button').contains('Tournaments').should('exist');
    cy.get('button').contains('Teams').should('exist');

    // Test filtering
    cy.get('button').contains('Tournaments').click();
    cy.get('[data-testid="news-card"]').should('exist');
  });

  it('navigates to news detail page', () => {
    // Click on first news item
    cy.get('[data-testid="news-card"]').first().click();

    // Verify navigation to detail page
    cy.url().should('include', '/news/');
    
    // Check content
    cy.get('h1').should('exist');
    cy.get('[data-testid="news-date"]').should('exist');
    cy.get('[data-testid="news-category"]').should('exist');
  });

  it('supports language switching', () => {
    // Switch to Russian
    cy.get('[data-testid="language-switcher"]').contains('RUS').click();

    // Verify translations
    cy.get('h1').should('contain', 'Новости');
    cy.get('button').contains('Все новости').should('exist');
    cy.get('button').contains('Турниры').should('exist');

    // Switch back to English
    cy.get('[data-testid="language-switcher"]').contains('ENG').click();
    cy.get('h1').should('contain', 'News');
  });

  it('handles share functionality', () => {
    // Navigate to news detail
    cy.get('[data-testid="news-card"]').first().click();

    // Check share buttons
    cy.get('[data-testid="share-buttons"]').within(() => {
      cy.get('button').contains('Telegram').should('exist');
      cy.get('button').contains('Twitter').should('exist');
      cy.get('button').contains('Facebook').should('exist');
    });

    // Test share click (mock)
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });
    cy.get('button').contains('Telegram').click();
    cy.get('@windowOpen').should('be.called');
  });

  it('handles back navigation', () => {
    // Navigate to detail and back
    cy.get('[data-testid="news-card"]').first().click();
    cy.get('[data-testid="back-button"]').click();
    cy.url().should('include', '/news');
  });
}); 