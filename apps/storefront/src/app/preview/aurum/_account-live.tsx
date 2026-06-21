import { AccountContent } from "../../../components/storefront/account/account-content"
import { LoginForm } from "../../../components/storefront/account/login-form"
import type { AccountProps, LoginProps } from "../../../lib/themes/types"
import { AurumFooter, AurumNav, aurumColorVars } from "./_live"
import s from "./_styles.module.css"

/** Aurum login + account slots — shared auth/account UI in Aurum chrome. */
export function AurumLoginPage({ config, next, error, notice }: LoginProps) {
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container} style={{ padding: "56px 0" }}>
          <LoginForm next={next} error={error} notice={notice} accent={config?.accent_color ?? undefined} />
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}

export function AurumAccountPage(props: AccountProps) {
  const { config } = props
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container} style={{ padding: "40px 0" }}>
          <AccountContent {...props} accent={config?.accent_color ?? undefined} />
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}
