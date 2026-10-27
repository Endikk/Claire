import { ALERT_KIND_LABELS, type Alert } from '@claire/engine'
import { formatDate } from '../lib/date'

type Props = {
  alert: Alert
  lineLabels: Map<string, string>
}

export function AlertItem({ alert, lineLabels }: Props) {
  const concerned = alert.lineIds.map((id) => lineLabels.get(id)).filter((label) => label !== undefined)
  const source = alert.source
    ? `${alert.source.name}, mise à jour du ${formatDate(alert.source.updatedAt)}${
        alert.source.reference ? `, ${alert.source.reference}` : ''
      }`
    : 'aucune source disponible pour ce contrôle'

  return (
    <li className={`alert alert-${alert.kind}`}>
      <p className="alert-kind">{ALERT_KIND_LABELS[alert.kind]}</p>
      {concerned.length > 0 && <p className="alert-lines">{concerned.join(' + ')}</p>}
      <p className="alert-problem">{alert.problem}</p>
      <p className="alert-action">
        <span className="alert-field">Conduite suggérée, à vérifier :</span> {alert.suggestedAction}
      </p>
      <p className="alert-source">
        <span className="alert-field">Source :</span> {source}
      </p>
    </li>
  )
}
