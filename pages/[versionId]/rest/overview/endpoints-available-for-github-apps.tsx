import { GetServerSideProps } from 'next'
import { Fragment } from 'react'
import { useRouter } from 'next/router'

import { AutomatedPage } from 'components/article/AutomatedPage'
import {
  AutomatedPageContext,
  AutomatedPageContextT,
  getAutomatedPageContextFromRequest,
} from 'components/context/AutomatedPageContext'
import { MainContextT, MainContext, getMainContext } from 'components/context/MainContext'
import { Link } from 'components/Link'
import { RestRedirect } from 'components/RestRedirect'
import { getEnabledForApps, categoriesWithoutSubcategories } from 'src/rest/lib/index.js'

type OperationT = {
  slug: string
  subcategory: string
  verb: string
  requestPath: string
}

type EnabledAppCategoryT = {
  [category: string]: OperationT[]
}

type Props = {
  mainContext: MainContextT
  currentVersion: string
  enabledForApps: EnabledAppCategoryT
  automatedPageContext: AutomatedPageContextT
  categoriesWithoutSubcategories: string[]
}

export default function Category({
  mainContext,
  currentVersion,
  enabledForApps,
  automatedPageContext,
  categoriesWithoutSubcategories,
}: Props) {
  const { locale } = useRouter()

  const content = Object.entries(enabledForApps).map(([category, operations]) => (
    <Fragment key={category}>
      {operations.length > 0 && (
        <h3 id={category}>
          <Link
            href={`/${locale}${
              currentVersion === 'free-pro-team@latest' ? '' : '/' + currentVersion
            }/rest/${category}`}
          >
            {category}
          </Link>
        </h3>
      )}
      <ul>
        {operations.map((operation, index) => (
          <li key={`enabledAppOperation-${operation.slug}-${index}`}>
            <Link
              href={`/${locale}${
                currentVersion === 'free-pro-team@latest' ? '' : '/' + currentVersion
              }/rest/${category}${
                categoriesWithoutSubcategories.includes(category) ? '' : '/' + operation.subcategory
              }#${operation.slug}`}
            >
              <code>
                <span className="text-uppercase">{operation.verb}</span> {operation.requestPath}
              </code>
            </Link>
          </li>
        ))}
      </ul>
    </Fragment>
  ))

  return (
    <MainContext.Provider value={mainContext}>
      <AutomatedPageContext.Provider value={automatedPageContext}>
        <RestRedirect />
        <AutomatedPage>{content}</AutomatedPage>
      </AutomatedPageContext.Provider>
    </MainContext.Provider>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const req = context.req as object
  const res = context.res as object
  const mainContext = await getMainContext(req, res)
  const currentVersion = context.query.versionId as string
  const apiVersion =
    context.query.apiVersion || mainContext.allVersions[currentVersion].latestApiVersion
  const automatedPageContext = getAutomatedPageContextFromRequest(req)
  const enabledForApps = await getEnabledForApps(currentVersion, apiVersion)

  // If getEnabledForApps came back as undefined, it means that nothing
  // could be found for that `apiVersion`
  if (!enabledForApps) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      mainContext,
      currentVersion,
      enabledForApps,
      automatedPageContext,
      categoriesWithoutSubcategories,
    },
  }
}
