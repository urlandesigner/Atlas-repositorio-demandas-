"use client"

import Image from "next/image"

import HeroGeometric from "@/components/ui/hero-geometric"

export function LoginHeroPanel() {
  return (
    <div className="relative flex h-full min-h-full w-full flex-1 flex-col overflow-hidden rounded-[24px]">
      <HeroGeometric
        className="absolute inset-0 min-h-0 h-full bg-transparent"
        color1="#2f3fc3"
        color2="#6d7ef7"
        speed={0.65}
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
            <h1 className="text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-white">
              Evolução profissional, com método.
            </h1>
            <p className="max-w-md text-base leading-7 text-white/78">
              PDIs, objetivos e registros em ambiente confidencial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
