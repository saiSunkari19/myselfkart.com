import { AccountContent } from "../../../components/storefront/account/account-content"
import { LoginForm } from "../../../components/storefront/account/login-form"
import type { AccountProps, LoginProps } from "../../../lib/themes/types"
import { ThreadFooter, ThreadNav } from "./_live"
import { threadColorVars } from "./_color-vars"
import s from "./_styles.module.css"

/** Thread login + account slots — shared auth/account UI in Thread chrome. */
export function ThreadLoginPage({ config, cartCount, next, error, notice }: LoginProps) {
  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container} style={{ padding: "56px 0" }}>
          <LoginForm next={next} error={error} notice={notice} accent={config?.accent_color ?? undefined} />
        </div>
      </div>
      <ThreadFooter config={config} />
    </div>
  )
}

export function ThreadAccountPage(props: AccountProps) {
  const { config, cartCount } = props
  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container} style={{ padding: "40px 0" }}>
          <AccountContent {...props} accent={config?.accent_color ?? undefined} />
        </div>
      </div>
      <ThreadFooter config={config} />
    </div>
  )
}
