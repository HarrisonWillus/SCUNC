import { Helmet } from 'react-helmet-async';

export const SEOHelmet = ({ 
  title = "Pitt Model UN", 
  description = "University of Pittsburgh Model United Nations", 
  keywords = "Model UN, University of Pittsburgh, Pitt, debate, international relations",
  canonical,
  image = "/pittmunlogo.png"
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="keywords" content={keywords} />
    {canonical && <link rel="canonical" href={canonical} />}
    
    {/* Open Graph */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    
    {/* Twitter */}
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
  </Helmet>
);