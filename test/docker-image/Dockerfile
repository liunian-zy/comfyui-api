ARG comfy_version=0.3.35
FROM comfy-testing:latest

RUN apt-get update && apt-get install -y \
  libgl1 \
  libgl1-mesa-glx \
  libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

RUN comfy node registry-install comfyui-videohelpersuite
RUN comfy node registry-install comfyui-animatediff-evolved
RUN comfy node registry-install efficiency-nodes-comfyui
RUN comfy node registry-install comfyui-advanced-controlnet
RUN comfy node registry-install comfyui-cogvideoxwrapper

COPY poses ${INPUT_DIR}/poses
ENV STARTUP_CHECK_MAX_TRIES=100