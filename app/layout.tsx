import type { Metadata } from 'next'
import {
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Oswald,
  Source_Sans_3,
  Raleway,
  PT_Sans,
  Merriweather,
  Nunito,
  Playfair_Display,
  Poppins,
  Ubuntu,
  Mukta,
  Lora,
  Noto_Sans,
  Rubik,
  Work_Sans,
  Karla,
  Libre_Baskerville,
  Arimo,
  Tinos,
  Crimson_Text,
  EB_Garamond,
  Libre_Franklin,
  PT_Serif,
  Courier_Prime,
  Space_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
  IBM_Plex_Mono,
  Fira_Sans,
  Archivo,
  Bitter,
  DM_Sans,
  Quicksand,
  Cabin,
  Hind,
  Inconsolata,
  Josefin_Sans,
  Oxygen,
  Titillium_Web,
  Nunito_Sans,
  Barlow,
  Cormorant,
  Heebo,
  Manrope
} from 'next/font/google'
import './globals.css'
// 1. IMPORT QUILL'S STYLESHEET GLOBALLY
import 'react-quill/dist/quill.snow.css'
import { Toaster } from 'sonner'

// Main fonts with all weights
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const roboto = Roboto({ weight: ['300', '400', '500', '700', '900'], subsets: ['latin'], variable: '--font-roboto' })
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })
const lato = Lato({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-lato' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans' })
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' })
const ptSans = PT_Sans({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-pt-sans' })
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-merriweather' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const poppins = Poppins({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-poppins' })
const ubuntu = Ubuntu({ weight: ['300', '400', '500', '700'], subsets: ['latin'], variable: '--font-ubuntu' })
const mukta = Mukta({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-mukta' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })
const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-noto-sans' })
const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' })
const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans' })
const karla = Karla({ subsets: ['latin'], variable: '--font-karla' })
const libreBaskerville = Libre_Baskerville({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-libre-baskerville' })
const arimo = Arimo({ subsets: ['latin'], variable: '--font-arimo' })
const tinos = Tinos({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-tinos' })
const crimsonText = Crimson_Text({ weight: ['400', '600', '700'], subsets: ['latin'], variable: '--font-crimson-text' })
const ebGaramond = EB_Garamond({ subsets: ['latin'], variable: '--font-eb-garamond' })
const libreFranklin = Libre_Franklin({ subsets: ['latin'], variable: '--font-libre-franklin' })
const ptSerif = PT_Serif({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-pt-serif' })
const courierPrime = Courier_Prime({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-courier-prime' })
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono' })
const ibmPlexSans = IBM_Plex_Sans({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-ibm-plex-sans' })
const ibmPlexSerif = IBM_Plex_Serif({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-ibm-plex-serif' })
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-ibm-plex-mono' })
const firaSans = Fira_Sans({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-fira-sans' })
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo' })
const bitter = Bitter({ subsets: ['latin'], variable: '--font-bitter' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand' })
const cabin = Cabin({ subsets: ['latin'], variable: '--font-cabin' })
const hind = Hind({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-hind' })
const inconsolata = Inconsolata({ subsets: ['latin'], variable: '--font-inconsolata' })
const josefinSans = Josefin_Sans({ subsets: ['latin'], variable: '--font-josefin-sans' })
const oxygen = Oxygen({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-oxygen' })
const titilliumWeb = Titillium_Web({ weight: ['300', '400', '600', '700'], subsets: ['latin'], variable: '--font-titillium-web' })
const nunitoSans = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito-sans' })
const barlow = Barlow({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-barlow' })
const cormorant = Cormorant({ subsets: ['latin'], variable: '--font-cormorant' })
const heebo = Heebo({ subsets: ['latin'], variable: '--font-heebo' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Message Board',
  description: 'Dynamic message board with rich content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${oswald.variable} ${sourceSans.variable} ${raleway.variable} ${ptSans.variable} ${merriweather.variable} ${nunito.variable} ${playfair.variable} ${poppins.variable} ${ubuntu.variable} ${mukta.variable} ${lora.variable} ${notoSans.variable} ${rubik.variable} ${workSans.variable} ${karla.variable} ${libreBaskerville.variable} ${arimo.variable} ${tinos.variable} ${crimsonText.variable} ${ebGaramond.variable} ${libreFranklin.variable} ${ptSerif.variable} ${courierPrime.variable} ${spaceMono.variable} ${ibmPlexSans.variable} ${ibmPlexSerif.variable} ${ibmPlexMono.variable} ${firaSans.variable} ${archivo.variable} ${bitter.variable} ${dmSans.variable} ${quicksand.variable} ${cabin.variable} ${hind.variable} ${inconsolata.variable} ${josefinSans.variable} ${oxygen.variable} ${titilliumWeb.variable} ${nunitoSans.variable} ${barlow.variable} ${cormorant.variable} ${heebo.variable} ${manrope.variable}`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}