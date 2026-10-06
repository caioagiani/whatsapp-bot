import { QRCodeSVG } from 'qrcode.react'
import type { Status } from '../lib/types'

export function ConnectionScreen({ status }: { status: Status | undefined }) {
  return (
    <div className="connect">
      <div className="connect__card">
        <div className="connect__text">
          <h1>Use o WhatsApp no bot</h1>
          <ol>
            <li>Abra o WhatsApp no seu celular.</li>
            <li>
              Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong> e selecione{' '}
              <strong>Aparelhos conectados</strong>.
            </li>
            <li>
              Toque em <strong>Conectar um aparelho</strong>.
            </li>
            <li>Aponte seu celular para esta tela para escanear o QR code.</li>
          </ol>
        </div>
        <div className="connect__qr">
          {status?.qr ? (
            <QRCodeSVG value={status.qr} size={264} level="L" marginSize={2} />
          ) : (
            <div className="connect__placeholder">
              <div className="spinner" />
              <span>{status?.status === 'authenticated' ? 'Autenticado, carregando…' : 'Gerando QR code…'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
