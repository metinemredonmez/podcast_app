{{/* Helm helpers */}}

{{- define "podcast-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "podcast-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "podcast-app.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "podcast-app.backendConfigMap" -}}
{{- default (printf "%s-backend-config" (include "podcast-app.fullname" .)) .Values.backend.configMapName -}}
{{- end -}}

{{- define "podcast-app.backendSecret" -}}
{{- default (printf "%s-backend-secret" (include "podcast-app.fullname" .)) .Values.backend.secretName -}}
{{- end -}}
