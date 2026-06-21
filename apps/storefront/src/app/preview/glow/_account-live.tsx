import { AccountContent } from "../../../components/storefront/account/account-content"
import { LoginForm } from "../../../components/storefront/account/login-form"
import type { AccountProps, LoginProps } from "../../../lib/themes/types"
import { Footer, PageLoader } from "./_components"
import { GlowLiveNav } from "./_live"
import s from "./_styles.module.css"

/** Glow login + account slots — shared auth/account UI in Glow chrome. */
export function GlowLoginPage({ config, next, error, notice }: LoginProps) {
  const storeName = config?.store_name ?? "glow."
  return (
    <div className={s.page}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={false} categories={[]} />
      <div className={s.headerSpacer} />
      <section className={s.section}>
        <div className={s.container}>
          <LoginForm next={next} error={error} notice={notice} accent={config?.accent_color ?? undefined} />
        </div>
      </section>
      <Footer storeName={storeName} />
    </div>
  )
}

export function GlowAccountPage(props: AccountProps) {
  const { config } = props
  const storeName = config?.store_name ?? "glow."
  return (
    <div className={s.page}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={false} categories={[]} />
      <div className={s.headerSpacer} />
      <section className={s.section}>
        <div className={s.container}>
          <AccountContent {...props} accent={config?.accent_color ?? undefined} />
        </div>
      </section>
      <Footer storeName={storeName} />
    </div>
  )
}
