"use client"

import Image from "next/image"
import dynamic from "next/dynamic"

const HeroGeometric = dynamic(() => import("@/components/ui/hero-geometric"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#070810]" />,
})

export function LoginHeroPanel() {
  return (
    <div className="relative flex h-full min-h-full w-full flex-1 flex-col overflow-hidden rounded-lg">
      <HeroGeometric
        className="absolute inset-0 min-h-0 h-full bg-transparent"
        // Campo escuro com luz índigo — o painel lê como o resto do produto
        // (quase-preto com azul pontual). O three não lê CSS vars, daí os literais.
        color1="#0A0C1A"
        color2="#3A4ADF"
        speed={0.45}
      />

      {/* Scrim: garante contraste do texto sobre o shader sem apagar o brilho do painel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[58%] bg-gradient-to-t from-[#070810] via-[#070810]/80 to-transparent"
      />

      <div className="relative z-10 flex min-h-full flex-col px-[2.4rem] xl:px-[3.2rem]">
        <div className="pt-[2.4rem]">
          <Image
            src="/images/yberagroup.svg"
            alt="YberaGroup"
            width={189}
            height={20}
            className="h-5 w-auto"
            priority
          />
        </div>

        <div className="flex flex-1 flex-col justify-end pb-[2.4rem] text-left">
          <div className="w-full max-w-lg space-y-4">
            <h1 className="text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-[#EEF0FF]">
              Evolução profissional, com método.
            </h1>
            <p className="max-w-md text-base leading-7 text-[#EEF0FF]/80">
              PDIs, objetivos e registros em ambiente confidencial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
