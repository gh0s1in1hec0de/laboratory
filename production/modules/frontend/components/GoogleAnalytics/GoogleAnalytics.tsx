import Script from "next/script";

export function GoogleAnalytics() {
  return (
    <>
      <Script
        // async
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        // dangerouslySetInnerHTML={{
        //   __html: `
        //     window.dataLayer = window.dataLayer || [];
        //     function gtag(){dataLayer.push(arguments);}
        //     gtag('js', new Date());
        //     gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_ID}');
        //   `,
        // }}
      >
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_ID}');
          `}
      </Script>
    </>
  );
}
