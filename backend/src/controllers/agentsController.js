export class AgentsController {
  constructor(agentsService) {
    this.agentsService = agentsService;
  }

  list = (req, res) => {
    try {
      res.json({ agents: this.agentsService.listAgents() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  create = (req, res) => {
    try {
      const agent = this.agentsService.createAgent(req.body || {});
      res.json({ agent });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  update = (req, res) => {
    try {
      const { id } = req.params;
      const updated = this.agentsService.updateAgent(id, req.body || {});
      res.json({ agent: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  remove = (req, res) => {
    try {
      const { id } = req.params;
      const removed = this.agentsService.deleteAgent(id);
      res.json({ agent: removed });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}
