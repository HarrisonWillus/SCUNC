// filepath: /Users/harrisonwilliams/Desktop/Computer Science/pittwebsite-harrisonwilliams/client/src/components/OrganizationStructuredData.jsx
export const OrganizationStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pitt Model UN",
    "url": "https://scuncmun.org", // Replace with your actual domain
    "logo": "https://scuncmun.org/pittmunlogo.png", // Replace with your actual domain
    "description": "University of Pittsburgh Model United Nations team promoting diplomacy and international relations through competitive debate",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Pittsburgh",
      "addressRegion": "PA",
      "addressCountry": "US"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "General Information",
      "email": "scuncmun@gmail.com" // Replace with your actual email
    }
  };

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};