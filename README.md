# wormcat3-web

# ADD PYTHONPATH to a Conda Environment
mkdir -p /Users/dan/miniforge3/envs/wormcat3-web/etc/conda/activate.d
vim /Users/dan/miniforge3/envs/wormcat3-web/etc/conda/activate.d/env_vars.sh

env_vars.sh
export PYTHONPATH="/Users/dan/Code/Python/wormcat3:$PYTHONPATH"


## Test Frontend code
`npx ava src/test/api/enrichmentAPI.test.mjs`

`lsof -i :8000`
