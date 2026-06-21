import { AccountContent } from "../../../components/storefront/account/account-content"
import { LoginForm } from "../../../components/storefront/account/login-form"
import type { AccountProps, LoginProps } from "../../../lib/themes/types"
import { Footer, PageLoader } from "./_components"
import { VoltNav } from "./_live"
import s from "./_styles.module.css"

/** Volt login + account slots — shared auth/account UI in Volt chrome. */
export function VoltLoginPage({ config, next, error, notice }: LoginProps) {
  return (
    <div className={s.pageShell}>
      <PageLoader />
      <VoltNav config={config} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.container} style={{ padding: "56px 0" }}>
          <LoginForm next={next} error={error} notice={notice} accent={config?.accent_color ?? undefined} />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export function VoltAccountPage(props: AccountProps) {
  const { config } = props
  return (
    <div className={s.pageShell}>
      <PageLoader />
      <VoltNav config={config} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.container} style={{ padding: "40px 0" }}>
          <AccountContent {...props} accent={config?.accent_color ?? undefined} />
        </div>
      </div>
      <Footer />
    </div>
  )
}
