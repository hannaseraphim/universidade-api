import type { Connection, ResultSetHeader } from "mysql2/promise";

export abstract class DefaultModule {
  protected abstract table: string;
  protected abstract tableFields: string[];
  protected abstract searchableFields: string[];

  constructor(protected connection: Connection) {}

  // Create a new item in the table
  async createItem(data: Record<string, any>): Promise<ResultSetHeader> {
    try {
      const fields = Object.keys(data).filter((key) =>
        this.tableFields.includes(key)
      );
      const values = fields.map((field) => data[field]);
      const placeholders = fields.map(() => "?").join(", ");

      const query = `INSERT INTO ${this.table} (${fields.join(
        ", "
      )}) VALUES (${placeholders})`;
      const [result] = await this.connection.execute(query, values);
      return result as ResultSetHeader;
    } catch (error) {
      console.error("Error creating item:", error);
      return [] as any;
    }
  }

  // Find items based on criteria
  async findOne(criteria: Record<string, any>): Promise<any | null> {
    try {
      const validKeys = Object.keys(criteria).filter((key) =>
        this.searchableFields.includes(key)
      );

      if (validKeys.length === 0) return null;

      const whereClauses = validKeys.map((key) => `${key} = ?`);
      const values = validKeys.map((key) => criteria[key]);

      const whereStatement = `WHERE ${whereClauses.join(" AND ")}`;
      const query = `SELECT * FROM ${this.table} ${whereStatement} LIMIT 1`;

      const [rows] = await this.connection.execute(query, values);

      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error finding item:", error);
      return null;
    }
  }

  // Find all table items
  async findAll(): Promise<any[]> {
    try {
      const query = `SELECT * FROM ${this.table}`;
      const [rows]: any[] = await this.connection.execute(query);
      return [rows];
    } catch (error) {
      console.error("Error finding table items: ", error);
      return [];
    }
  }

  // Update items based on criteria
  async updateItem(
    id: number | string,
    data: Record<string, any>,
    whereField: string | "id"
  ): Promise<boolean> {
    try {
      if (Object.keys(data).length === 0) return false;

      const assignments = Object.keys(data)
        .map((key) => `\`${key}\` = ?`)
        .join(", ");

      const values = [...Object.values(data), id];
      const query = `UPDATE \`${this.table}\` SET ${assignments} WHERE \`${whereField}\` = ?`;

      await this.connection.execute(query, values);
      return true;
    } catch (error) {
      console.error("Error updating item:", error);
      return false;
    }
  }

  // Delete item from table
  async deleteItem(id: number | string, criteria: string): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.table} WHERE ${criteria} = ?`;
      await this.connection.execute(query, [id]);

      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  }

  // Validate fields based on table fields
  async validateFields(data: Record<string, any>): Promise<boolean> {
    try {
      const invalid = Object.keys(data).filter(
        (key) => !this.tableFields.includes(key)
      );

      if (invalid.length) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error("Error during fields validation: ", error);
      return false;
    }
  }
}
